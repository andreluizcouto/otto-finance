import os
import re

# Frontend mappings for pages
PAGE_MAP = {
    "Welcome": "auth/pages/Welcome",
    "Login": "auth/pages/Login",
    "Dashboard": "dashboard/pages/Dashboard",
    "Transactions": "transactions/pages/Transactions",
    "TransactionDetail": "transactions/pages/TransactionDetail",
    "Categories": "transactions/pages/Categories",
    "Goals": "goals/pages/Goals",
    "Settings": "settings/pages/Settings",
    "Onboarding1": "onboarding/pages/Onboarding1",
    "Onboarding2": "onboarding/pages/Onboarding2",
    "Onboarding3": "onboarding/pages/Onboarding3",
}

def fix_frontend_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace relative paths that end with a known page component
    # e.g. import { Login } from "./pages/Login" or "../../pages/Login"
    for page, feature_path in PAGE_MAP.items():
        # Match 'from ".*pages/Login"' or 'from "../pages/Login"' etc.
        pattern = r'from\s+["\'][^"\']*?/?pages/' + page + r'["\']'
        content = re.sub(pattern, f'from "@/features/{feature_path}"', content)

    # Match standard shared directories
    # anything that has components/ui -> @/shared/components/ui
    content = re.sub(r'from\s+["\'][^"\']*?/?components/ui([^"\']*)["\']', r'from "@/shared/components/ui\1"', content)
    content = re.sub(r'from\s+["\'][^"\']*?/?components/layout([^"\']*)["\']', r'from "@/shared/components/layout\1"', content)
    content = re.sub(r'from\s+["\'][^"\']*?/?components/figma([^"\']*)["\']', r'from "@/shared/components/figma\1"', content)
    
    # lib and styles
    content = re.sub(r'from\s+["\'][^"\']*?/?lib/([^"\']+)["\']', r'from "@/shared/lib/\1"', content)
    
    # CSS imports (import "../styles/theme.css")
    content = re.sub(r'import\s+["\'][^"\']*?/?styles/([^"\']+)["\']', r'import "@/shared/styles/\1"', content)
    
    # The App route in main.tsx
    content = re.sub(r'import\s+App\s+from\s+["\'][^"\']*?/?app/App(?:\.tsx)?["\']', 'import App from "@/app/App"', content)
    
    # The routes in App.tsx
    content = re.sub(r'from\s+["\'][^"\']*?/?routes["\']', 'from "@/app/routes"', content)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

def fix_backend_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    content = re.sub(r'from backend\.api\.deps import', 'from backend.core import', content)
    content = re.sub(r'from backend\.core\.config import', 'from backend.core import', content)
    content = re.sub(r'from backend\.services\.[a-z_]+ import', 'from backend.services import', content)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

def main():
    for root, dirs, files in os.walk("src"):
        for file in files:
            if file.endswith(".ts") or file.endswith(".tsx"):
                fix_frontend_file(os.path.join(root, file))

    for root, dirs, files in os.walk("backend"):
        for file in files:
            if file.endswith(".py"):
                fix_backend_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
