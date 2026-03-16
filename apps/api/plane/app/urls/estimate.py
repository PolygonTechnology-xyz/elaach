from django.urls import path

from plane.app.views import (
    ProjectEstimatePointEndpoint,
    ProjectEstimateTimeEndpoint, 
    BulkEstimatePointEndpoint,
    EstimatePointEndpoint,
)

urlpatterns = [
    # Endpoint for Points specific data
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/project-estimates/",
        ProjectEstimatePointEndpoint.as_view(),
        name="project-estimate-points",
    ),
    # Endpoint for Time specific data
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/estimate-time/",
        ProjectEstimateTimeEndpoint.as_view(),
        name="project-estimate-time",
    ),
    # General Bulk actions
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/estimates/",
        BulkEstimatePointEndpoint.as_view({"get": "list", "post": "create"}),
        name="bulk-create-estimate-points",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/estimates/<uuid:estimate_id>/",
        BulkEstimatePointEndpoint.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="project-estimate-detail",
    ),
    # Individual Point management within an Estimate
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/estimates/<uuid:estimate_id>/estimate-points/",
        EstimatePointEndpoint.as_view({"post": "create"}),
        name="estimate-points",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/estimates/<uuid:estimate_id>/estimate-points/<uuid:estimate_point_id>/",
        EstimatePointEndpoint.as_view({"patch": "partial_update", "delete": "destroy"}),
        name="estimate-point-detail",
    ),
]