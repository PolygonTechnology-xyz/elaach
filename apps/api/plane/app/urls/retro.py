from django.urls import path
from plane.api.views import RetroBoardViewSet, RetroItemViewSet

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/retro-boards/",
        RetroBoardViewSet.as_view({"get": "list", "post": "create"}),
        name="retro-board",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/retro-boards/<uuid:pk>/",
        RetroBoardViewSet.as_view({
            "get": "retrieve", 
            "patch": "partial_update", 
            "delete": "destroy"
        }),
        name="project-retro-board-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/retro-boards/",
        RetroBoardViewSet.as_view({"get": "list", "post": "create"}),
        name="retro-board-list",
    ),
    
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/retro-boards/<uuid:pk>/",
        RetroBoardViewSet.as_view({
            "post": "create",
            "get": "retrieve", 
            "patch": "partial_update", 
            "delete": "destroy"
        }),
        name="retro-board-detail",
    ),

    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/retro-items/",
        RetroItemViewSet.as_view({"get": "list", "post": "create"}),
        name="retro-item-list",
    ),
    
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/retro-items/<uuid:pk>/",
        RetroItemViewSet.as_view({
            "post": "create",
            "get": "retrieve", 
            "patch": "partial_update", 
            "delete": "destroy"
        }),
        name="retro-item-detail",
    ),
]