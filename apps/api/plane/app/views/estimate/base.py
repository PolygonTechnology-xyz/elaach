import random
import string
import json

# Django imports
from django.utils import timezone
from django.db import transaction

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from ..base import BaseViewSet, BaseAPIView
from plane.app.permissions import ProjectEntityPermission, allow_permission, ROLE
from plane.db.models import Project, Estimate, EstimatePoint, Issue
from plane.app.serializers import (
    EstimateSerializer,
    EstimatePointSerializer,
    EstimateReadSerializer,
)
from plane.utils.cache import invalidate_cache
from plane.bgtasks.issue_activities_task import issue_activity


def generate_random_name(length=10):
    letters = string.ascii_lowercase
    return "".join(random.choice(letters) for i in range(length))


class ProjectEstimatePointEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        # Fetch the estimate of type 'points' for this project
        estimate = Estimate.objects.filter(
            workspace__slug=slug, 
            project_id=project_id, 
            type="points"
        ).first()

        if estimate:
            estimate_points = EstimatePoint.objects.filter(estimate=estimate)
            serializer = EstimatePointSerializer(estimate_points, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response([], status=status.HTTP_200_OK)

    def post(self, request, slug, project_id):
        if "estimate" not in request.data:
            request.data["estimate"] = {}
        request.data["estimate"]["type"] = "points"
        
        # Route to Bulk creation logic
        view = BulkEstimatePointEndpoint()
        view.request = request
        view.format_kwarg = None
        return view.create(request, slug=slug, project_id=project_id)


class ProjectEstimateTimeEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        # Fetch the estimate of type 'time' for this project
        estimate = Estimate.objects.filter(
            workspace__slug=slug, 
            project_id=project_id, 
            type="time"
        ).first()

        if estimate:
            estimate_points = EstimatePoint.objects.filter(estimate=estimate)
            serializer = EstimatePointSerializer(estimate_points, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response([], status=status.HTTP_200_OK)

    def post(self, request, slug, project_id):
        if "estimate" not in request.data:
            request.data["estimate"] = {}
        request.data["estimate"]["type"] = "time"
        
        # Route to Bulk creation logic
        view = BulkEstimatePointEndpoint()
        view.request = request
        view.format_kwarg = None
        return view.create(request, slug=slug, project_id=project_id)


class BulkEstimatePointEndpoint(BaseViewSet):
    permission_classes = [ProjectEntityPermission]
    model = Estimate
    serializer_class = EstimateSerializer

    def list(self, request, slug, project_id):
        estimates = (
            Estimate.objects.filter(workspace__slug=slug, project_id=project_id)
            .prefetch_related("points")
            .select_related("workspace", "project")
        )
        serializer = EstimateReadSerializer(estimates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @invalidate_cache(path="/api/workspaces/:slug/estimates/", url_params=True, user=False)
    def create(self, request, slug, project_id):
        estimate_data = request.data.get("estimate", {})
        estimate_type = estimate_data.get("type", "points")
        estimate_name = estimate_data.get("name", f"{estimate_type.capitalize()} System")
        
        with transaction.atomic():
            # Dual Estimation: Get existing system for this type or create a new one
            estimate, created = Estimate.objects.get_or_create(
                project_id=project_id,
                workspace__slug=slug,
                type=estimate_type,
                defaults={
                    "name": estimate_name,
                    "last_used": estimate_data.get("last_used", False)
                }
            )

            # If it already existed, we might want to update its name
            if not created and "name" in estimate_data:
                estimate.name = estimate_data.get("name")
                estimate.save()

            estimate_points_data = request.data.get("estimate_points", [])

            # Clear old points to replace with the new dual configuration
            EstimatePoint.objects.filter(estimate=estimate).delete()

            # Bulk create new points
            EstimatePoint.objects.bulk_create(
                [
                    EstimatePoint(
                        estimate=estimate,
                        key=point.get("key", 0),
                        value=point.get("value", ""),
                        description=point.get("description", ""),
                        project_id=project_id,
                        workspace_id=estimate.workspace_id,
                        created_by=request.user,
                        updated_by=request.user,
                    )
                    for point in estimate_points_data
                ],
                batch_size=50
            )

        serializer = EstimateReadSerializer(estimate)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def retrieve(self, request, slug, project_id, estimate_id):
        estimate = Estimate.objects.get(pk=estimate_id, workspace__slug=slug, project_id=project_id)
        serializer = EstimateReadSerializer(estimate)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @invalidate_cache(path="/api/workspaces/:slug/estimates/", url_params=True, user=False)
    def partial_update(self, request, slug, project_id, estimate_id):
        estimate = Estimate.objects.get(pk=estimate_id, workspace__slug=slug, project_id=project_id)

        if "estimate" in request.data:
            estimate.name = request.data.get("estimate").get("name", estimate.name)
            estimate.type = request.data.get("estimate").get("type", estimate.type)
            estimate.save()

        estimate_points_data = request.data.get("estimate_points", [])
        if estimate_points_data:
            # Update specific points if IDs are provided, or you can use the bulk-replace logic from create
            for point_data in estimate_points_data:
                if "id" in point_data:
                    EstimatePoint.objects.filter(pk=point_data["id"]).update(
                        value=point_data.get("value"),
                        key=point_data.get("key")
                    )

        estimate_serializer = EstimateReadSerializer(estimate)
        return Response(estimate_serializer.data, status=status.HTTP_200_OK)

    @invalidate_cache(path="/api/workspaces/:slug/estimates/", url_params=True, user=False)
    def destroy(self, request, slug, project_id, estimate_id):
        estimate = Estimate.objects.get(pk=estimate_id, workspace__slug=slug, project_id=project_id)
        estimate.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EstimatePointEndpoint(BaseViewSet):
    # This remains largely the same but ensures activity is logged for dual fields
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id, estimate_id):
        key = request.data.get("key", 0)
        value = request.data.get("value", "")
        estimate_point = EstimatePoint.objects.create(
            estimate_id=estimate_id, project_id=project_id, key=key, value=value
        )
        return Response(EstimatePointSerializer(estimate_point).data, status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def destroy(self, request, slug, project_id, estimate_id, estimate_point_id):
        # Handling the removal of a point and updating affected issues
        estimate = Estimate.objects.get(pk=estimate_id)
        field_to_update = "estimate_point" if estimate.type == "points" else "estimate_time"
        
        issues = Issue.objects.filter(**{field_to_update: estimate_point_id})
        
        for issue in issues:
            issue_activity.delay(
                type="issue.activity.updated",
                requested_data=json.dumps({field_to_update: None}),
                actor_id=str(request.user.id),
                issue_id=issue.id,
                project_id=str(project_id),
                current_instance=json.dumps({field_to_update: str(estimate_point_id)}),
                epoch=int(timezone.now().timestamp()),
            )
        
        issues.update(**{field_to_update: None})
        EstimatePoint.objects.filter(pk=estimate_point_id).delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)