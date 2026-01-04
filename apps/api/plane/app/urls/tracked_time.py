from django.urls import path
from plane.api.views import TrackedTimeViewSet

urlpatterns = [

    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/tracked-times/total/",
        TrackedTimeViewSet.as_view({"get": "get_issue_tracked_time"}),
        name="issue-tracked-times-total",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/tracked-times/",
        TrackedTimeViewSet.as_view({"get": "list", "post": "create"}),
        name="issue-tracked-times",
    ),

    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/tracked-times/<uuid:pk>/",
        TrackedTimeViewSet.as_view({
            "get": "retrieve",
            "put": "update",
            "patch": "partial_update",
            "delete": "destroy"
        }),
        name="issue-tracked-times-detail",
    ),

]