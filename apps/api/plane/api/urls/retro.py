from django.urls import path, include
from plane.api.views.retro import RetroBoardViewSet, RetroItemViewSet
from rest_framework.routers import DefaultRouter

urlpatterns = [
    path ("workspaces/<str:slug>/projects/<uuid:project_id>/retro-boards/",
          RetroBoardViewSet.as_view(
            http_method_names=["get", "post"],  
            actions={
             "get": "list",
             "post": "create"
         }),
         name="retro-board",
    ),
    path("workspaces/<str:slug>/projects/<uuid:project_id>/retro-boards/<uuid:pk>/",
        RetroBoardViewSet.as_view(
            http_method_names=["get", "patch", "delete"],
            actions={
            "get": "retrieve", 
            "patch": "partial_update", 
            "delete": "destroy"
        }),
        name="project-retro-board-detail",
    ),
    path("workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/retro-boards/",
        RetroBoardViewSet.as_view(
            http_method_names=["get", "post"],
            actions={
            "get": "list", 
            "post": "create"
        }),
        name="retro-board-list",
    ),
    path("workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/retro-boards/<uuid:pk>/",
        RetroBoardViewSet.as_view(
            http_method_names=["post","get", "patch", "delete"],
            actions={
            "post": "create",
            "get": "retrieve", 
            "patch": "partial_update", 
            "delete": "destroy"
        }),
        name="retro-board-detail",
    ),

    path("workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/retro-items/",
        
        RetroItemViewSet.as_view(
            http_method_names=["get", "post"],
            actions={
            "get": "list", 
            "post": "create"
        }),
        name="retro-item-list",
    ),
    path("workspaces/<str:slug>/projects/<uuid:project_id>/cycles/<uuid:cycle_id>/retro-items/<uuid:pk>/",
        RetroItemViewSet.as_view(
            http_method_names=["post","get", "patch", "delete"],
            actions={
            "post": "create",
            "get": "retrieve", 
            "patch": "partial_update", 
            "delete": "destroy"
        }),
        name="retro-item-detail",
    ),
]