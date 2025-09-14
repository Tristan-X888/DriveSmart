import os
import sys

def main():
    """Run administrative tasks."""
    # Load environment variables from .env (project root)
    # Requires: pip install python-dotenv
    try:
        from dotenv import load_dotenv, find_dotenv
        load_dotenv(find_dotenv(), override=False)
    except Exception:
        # If python-dotenv isn't installed, we just continue without failing.
        pass

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "server.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == "__main__":
    main()
