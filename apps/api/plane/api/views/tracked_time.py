import traceback
from datetime import timedelta
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from plane.db.models import User
from plane.db.models.tracked_time import TrackedTime
from plane.app.serializers.tracked_time import TrackedTimeSerializer
import rest_framework.decorators as drf_decorator
from rest_framework.decorators import action
# Django database aggregation import
from django.db.models import Sum 

def seconds_to_readable_format(seconds):
    """
    Given a total number of seconds, returns a readable format string (e.g., "15h 20m").
    This is an efficient helper function.
    """
    if seconds is None or seconds == 0:
        return "0h 0m"
    
    total_hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    
    return f"{total_hours}h {minutes}m"

class TrackedTimeViewSet(viewsets.ModelViewSet):
    serializer_class = TrackedTimeSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get_queryset(self):
        filters = {}
        if self.kwargs.get("user_id"):
            filters["user_id"] = self.kwargs.get("user_id")
        return TrackedTime.objects.filter(**filters)

    def create(self, request, *args, **kwargs):
        try:
            project_id = self.kwargs.get("project_id")
            issue_id = self.kwargs.get("issue_id")
            
            user = None
            if 'user' in request.data and request.data['user']:
                user = User.objects.filter(id=request.data['user']).first()
            if not user:
                user = User.objects.first() 
            if not user:
                raise Exception("No user found in database")

            raw_time = request.data.get("total_spent_time", 0)
            if not raw_time:
                raw_time = request.data.get("time", 0)

            try:
                duration_value = timedelta(seconds=int(raw_time))
            except (TypeError, ValueError):
                duration_value = timedelta(seconds=0)


            tracked_time = TrackedTime.objects.create(
                user=user,
                project_id=project_id,
                issue_id=issue_id,
                created_by=user,
                updated_by=user,
                description=request.data.get("description", ""),
                total_spent_time=duration_value
            )

            return Response({
                "id": str(tracked_time.id),
                "user_id": str(user.id),
                "total_spent_time": str(tracked_time.total_spent_time), 
                "message": "Successfully saved!"
            }, status=201)
        except Exception as e:
            error_details = traceback.format_exc()
            return Response({
                "error_message": str(e),
                "detailed_traceback": error_details
            }, status=500)
    
    
    @action(detail=False, methods=["get"], url_path="total")
    def get_issue_tracked_time(self, request, *args, **kwargs):
        """
        Calculates the total tracked time for the issue provided in kwargs/URL.
        This uses efficient database aggregation (Sum).
        The expected URL pattern is often handled automatically by the router.
        """
        try:
            issue_id = kwargs.get("issue_id")

            if not issue_id:
                return Response({"error_message": "issue_id is required from URL path"}, status=status.HTTP_400_BAD_REQUEST)

            aggregation_result = TrackedTime.objects.filter(
                issue_id=issue_id
            ).aggregate(
                total=Sum('total_spent_time')
            )
            
            total_timedelta = aggregation_result.get('total')

            if total_timedelta:
                total_seconds = int(total_timedelta.total_seconds())
            else:
                total_seconds = 0

            readable_format = seconds_to_readable_format(total_seconds)

            return Response({
                "issue_id": issue_id,
                "total_seconds": total_seconds,
                "readable_format": readable_format
            }, status=status.HTTP_200_OK)

        except Exception as e:
            error_details = traceback.format_exc()
            return Response({
                "error_message": f"An error occurred during time aggregation: {str(e)}",
                "detailed_traceback": error_details
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)