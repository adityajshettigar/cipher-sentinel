from celery import Celery

# Connect to local Redis (default port 6379)
celery_app = Celery(
    "cipher_tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1",
    include=['worker.tasks']
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
)