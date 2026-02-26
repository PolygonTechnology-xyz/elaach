from django.db import models
from .project import ProjectBaseModel

class RetroBoard(ProjectBaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    
    project = models.ForeignKey(
        "db.Project", 
        on_delete=models.CASCADE, 
        related_name="retro_boards"
    )
    cycle = models.ForeignKey(
        "db.Cycle", 
        on_delete=models.CASCADE, 
        related_name="retro_boards"
    )
    
    class Meta:
        verbose_name = "Retro Board"
        verbose_name_plural = "Retro Boards"
        db_table = "retro_boards"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.name} - {self.cycle.name}"

class RetroItem(ProjectBaseModel):
    retro_board = models.ForeignKey(
        RetroBoard, 
        on_delete=models.CASCADE, 
        related_name="details"
    )
    glad = models.TextField(blank=True, null=True)
    sad = models.TextField(blank=True, null=True)
    mad = models.TextField(blank=True, null=True)
    action_point = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Retro Item"
        verbose_name_plural = "Retro Items"
        db_table = "retro_items"
        ordering = ("-created_at",)

    def __str__(self):
        return f"Item for {self.retro_board.name}"