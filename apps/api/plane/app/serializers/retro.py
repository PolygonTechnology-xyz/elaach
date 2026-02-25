from rest_framework import serializers
from plane.db.models.retro import RetroBoard, RetroItem


class RetroItemSerializer(serializers.ModelSerializer):
    cycle_id = serializers.ReadOnlyField(source="retro_board.cycle.id")
    project_id = serializers.ReadOnlyField(source="retro_board.project.id")
    class Meta:
        model = RetroItem
        fields = [
            "id",
            "retro_board",
            "cycle_id",
            "project_id",
            "glad",
            "sad", 
            "mad",
            "action_point",
            "created_at",
            "updated_at",
            "created_by",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "created_by"]


class RetroBoardSerializer(serializers.ModelSerializer):
    details = RetroItemSerializer(many=True, read_only=True)
    progress_details = serializers.SerializerMethodField()
    
    cycle_name = serializers.ReadOnlyField(source="cycle.name")
    cycle_id = serializers.ReadOnlyField(source="cycle.id")

    class Meta:
        model = RetroBoard
        fields = [
            "id",
            "name",
            "description",
            "project",
            "cycle",
            "cycle_id",
            "cycle_name",
            "progress_details",
            "details",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "id",
            "cycle",
            "project",
            "cycle_id",
            "cycle_name",
            "progress_details",
            "details",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]

    def get_progress_details(self, obj):
        total = getattr(obj, 'total_issues', 0)
        completed = getattr(obj, 'completed_issues', 0)
        
        percent = round((completed / total) * 100) if total > 0 else 0
        
        return {
            "total_issues": total,
            "completed_issues": completed,
            "percentage_completed": f"{percent}%",
            "status": "success" if percent >= 80 else "failed"
        }