import os

# Define the directory structure with files
structure = {
    "Vectra": [
        "README.md",
        ".gitignore",
        "docker-compose.yml",
        {"docs": [
            {"architecture": ["system-overview.md", "module-boundaries.md", "event-contracts.md"]},
            {"api": ["rest-api-spec.md", "websocket-events.md"]},
            {"db": ["schema.md", "migrations-guide.md"]},
            {"onboarding": ["local-setup.md", "branch-workflow.md"]}
        ]},
        {"shared": [
            {"contracts": [
                {"rest": ["auth.yaml", "users.yaml", "rides.yaml", "drivers.yaml", "admin.yaml", "analytics.yaml"]},
                {"realtime": ["events.yaml", "rooms.yaml"]}
            ]},
            {"constants": ["roles.md", "trip-status.md", "error-codes.md"]},
            {"utils": ["README.md"]}
        ]},
        {"infrastructure": [
            {"database": ["schema.sql", "seed.sql", {"migrations": []}]},
            {"redis": ["README.md"]},
            {"env": ["backend.example.env", "ml.example.env", "rider.example.env", "driver.example.env", "admin.example.env"]}
        ]},
        {"module-1-core-platform": [
            {"backend": [
                {"src": [
                    "main.ts", "app.module.ts",
                    {"config": []},
                    {"common": [{"guards": []}, {"filters": []}, {"interceptors": []}, {"pipes": []}]},
                    {"database": [{"prisma": []}, {"typeorm": []}, {"migrations": []}]},
                    {"auth": ["auth.module.ts", "auth.controller.ts", "auth.service.ts",
                              {"dto": []}, {"strategies": []}, {"guards": []}]},
                    {"users": []},
                    {"roles": []},
                    {"realtime": []},
                    {"health": []}
                ]},
                {"test": []},
                "package.json",
                "tsconfig.json"
            ]},
            "README.md"
        ]},
        {"module-2-rider-system": [
            {"mobile": [
                {"lib": [
                    {"app": []},
                    {"features": [{"auth": []}, {"ride_request": []}, {"pooling": []},
                                  {"trip_tracking": []}, {"fare_ratings": []}]},
                    {"services": ["api_client.dart", "auth_api.dart", "rides_api.dart", "socket_service.dart"]},
                    {"core": []},
                    "main.dart"
                ]},
                "pubspec.yaml",
                "README.md"
            ]},
            "README.md"
        ]},
        {"module-3-driver-system": [
            {"mobile": [
                {"lib": [
                    {"app": []},
                    {"features": [{"auth": []}, {"availability": []}, {"gps_broadcast": []},
                                  {"ride_offers": []}, {"trip_execution": []}, {"navigation": []}]},
                    {"services": ["api_client.dart", "drivers_api.dart", "socket_service.dart"]},
                    {"core": []},
                    "main.dart"
                ]},
                "pubspec.yaml",
                "README.md"
            ]},
            "README.md"
        ]},
        {"module-4-intelligence": [
            {"ml-service": [
                {"app": [
                    "main.py",
                    {"api": ["pooling.py", "routing.py", "demand.py"]},
                    {"core": ["config.py", "logging.py"]},
                    {"models": []},
                    {"services": ["pooling_service.py", "routing_service.py", "demand_service.py"]},
                    {"schemas": []},
                    {"tests": []}
                ]},
                "requirements.txt",
                "README.md"
            ]},
            {"algorithms": [{"pooling": []}, {"routing": []}, {"demand": []}]},
            "README.md"
        ]},
        {"module-5-admin-safety": [
            {"web-admin": [
                {"src": [
                    {"app": []},
                    {"features": [{"auth": []}, {"user_management": []}, {"driver_verification": []},
                                  {"fleet_monitor": []}, {"safety_incidents": []}, {"analytics": []}]},
                    {"services": []},
                    "main.tsx"
                ]},
                "package.json",
                "README.md"
            ]},
            {"backend-extension": ["README.md"]},
            "README.md"
        ]},
        {"tools": [
            {"scripts": ["dev-up.ps1", "dev-up.sh", "lint-all.sh"]},
            "README.md"
        ]}
    ]
}


def create_structure(base, items):
    """Recursively create directories and files."""
    for item in items:
        if isinstance(item, str):
            # Create file
            file_path = os.path.join(base, item)
            os.makedirs(base, exist_ok=True)
            with open(file_path, "w") as f:
                f.write("")  # empty placeholder
        elif isinstance(item, dict):
            for folder, contents in item.items():
                folder_path = os.path.join(base, folder)
                os.makedirs(folder_path, exist_ok=True)
                create_structure(folder_path, contents)


if __name__ == "__main__":
    create_structure(".", [structure])
    print("✅ Vectra directory structure created successfully!")