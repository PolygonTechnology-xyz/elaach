from rest_framework import serializers
from plane.db.models.tracked_time import TrackedTime
from datetime import timedelta

class TrackedTimeSerializer(serializers.ModelSerializer):
    readable_format = serializers.CharField(source="get_hours_minutes", read_only=True)
    
    total_seconds = serializers.SerializerMethodField()
    
    total_spent_time = serializers.JSONField() 

    class Meta:
        model = TrackedTime
        fields = [
            "id",
            "user",
            "project",
            "issue",
            "description",
            "total_spent_time",
            "total_seconds",
            "readable_format",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", 
            "user", 
            "project", 
            "issue", 
            "created_at", 
            "updated_at"
        ]

    def get_total_seconds(self, obj):
        if obj.total_spent_time:
            return int(obj.total_spent_time.total_seconds())
        return 0

    def validate_total_spent_time(self, value):
        if isinstance(value, int) or (isinstance(value, str) and value.isdigit()):
            return timedelta(seconds=int(value))
        elif isinstance(value, timedelta):
            return value
        return value

    def create(self, validated_data):
        return super().create(validated_data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.total_spent_time:
            ret['total_spent_time'] = str(instance.total_spent_time)
        return ret