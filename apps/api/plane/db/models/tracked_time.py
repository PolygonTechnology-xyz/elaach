from django.db import models
import uuid
from django.conf import settings
from plane.db.models.base import BaseModel
from plane.db.models.issue import Issue
from datetime import timedelta


class TrackedTime(BaseModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tracked_times"
    )

    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="tracked_times"
    )

    issue = models.ForeignKey(
        Issue,
        on_delete=models.CASCADE,
        related_name="tracked_times",
        null=True,
        blank=True
    )

    total_spent_time = models.DurationField(
        default=timedelta(),
        verbose_name="Total Accumulated Time"
    )

    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Tracked Time"
        verbose_name_plural = "Tracked Times"
        db_table = "tracked_time"
        ordering = []

    def __str__(self):
        return f"{self.user} - {self.get_hours_minutes()}"

    def get_hours_minutes(self):
        seconds = self.total_spent_time.total_seconds()
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        return f"{hours}h {minutes}m"

    def add_time(self, delta):
        self.total_spent_time += delta
        self.save()
