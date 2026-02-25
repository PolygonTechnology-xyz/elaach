from django.db.models import Count, Q
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny

from plane.db.models.retro import RetroBoard, RetroItem
from plane.app.serializers.retro import RetroBoardSerializer, RetroItemSerializer
from plane.app.permissions import ProjectEntityPermission


class RetroBoardViewSet(viewsets.ModelViewSet):
    serializer_class = RetroBoardSerializer
    model = RetroBoard
    permission_classes = [AllowAny]
    queryset = RetroBoard.objects.all()

    def get_queryset(self):
        return RetroBoard.objects.filter(
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug")
        ).select_related("cycle").prefetch_related("details").annotate(
            total_issues=Count(
                'cycle__issue_cycle__issue',
                distinct=True,
                filter=Q(cycle__issue_cycle__deleted_at__isnull=True)
            ),
            completed_issues=Count(
                'cycle__issue_cycle__issue',
                distinct=True,
                filter=Q(
                    cycle__issue_cycle__issue__state__group="completed",
                    cycle__issue_cycle__deleted_at__isnull=True
                )
            )
        ).order_by("-created_at")

    def create(self, request, *args, **kwargs):
        """Create a new retro board"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            cycle_id=self.kwargs.get("cycle_id"),
        )

    def list(self, request, *args, **kwargs):
        """List all retro boards for a project/cycle"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Filter by cycle_id if provided in URL
        cycle_id = self.kwargs.get("cycle_id")
        if cycle_id:
            queryset = queryset.filter(cycle_id=cycle_id)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific retro board"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        """Update a retro board"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Delete a retro board"""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

        
class RetroItemViewSet(viewsets.ModelViewSet):
    serializer_class = RetroItemSerializer
    permission_classes = [ProjectEntityPermission]
    queryset = RetroItem.objects.all()
    
    @property
    def workspace_slug(self):
        return self.kwargs.get("slug")
    @property
    def project_id(self):
        return self.kwargs.get("project_id")
    
    def get_queryset(self):
        return RetroItem.objects.filter(
            project_id=self.project_id,
            workspace__slug=self.workspace_slug,
            retro_board__cycle_id=self.kwargs.get("cycle_id") 
        ).select_related('retro_board')

    def create(self, request, *args, **kwargs):
        """Create a new retro item"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.project_id,
            workspace_id=self.request.workspace.id if hasattr(self.request, 'workspace') else None
        )

    def list(self, request, *args, **kwargs):
        """List all retro items"""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)