# /// script
# dependencies = [
#   "rich",
#   "python-dotenv",
# ]
# ///

import os
import subprocess
import sys
from rich.console import Console
from rich.panel import Panel
from dotenv import load_dotenv

console = Console()

def run_sync():
    console.print(Panel.fit("PayloadCMS Data Sync Orchestrator", style="bold magenta"))
    
    # Load environment variables from .env.local
    load_dotenv(".env.local")
    
    source_url = os.getenv("SOURCE_DATABASE_URL")
    target_url = os.getenv("DATABASE_URL")
    
    if not source_url:
        console.print("[bold red]❌ Error:[/bold red] SOURCE_DATABASE_URL is not set in .env.local or environment.")
        console.print("[yellow]Please provide the connection string for the source database branch.[/yellow]")
        sys.exit(1)
        
    console.print(f"[bold blue]Source:[/bold blue] {source_url[:30]}...")
    console.print(f"[bold green]Target:[/bold green] {target_url[:30]}...")
    
    # Run the TypeScript sync script via pnpm tsx
    console.print("\n[bold]📦 Running TypeScript Sync Script...[/bold]")
    
    try:
        # Pass all environment variables to the subprocess
        env = os.environ.copy()
        env["PAYLOAD_SYNC_MODE"] = "true"
        
        # On Windows, pnpm is often a .cmd or .ps1 file, so we use shell=True
        # or call it explicitly. shell=True is generally safer for finding npm/pnpm.
        result = subprocess.run(
            ["pnpm", "tsx", "src/scripts/sync-data.ts"],
            env=env,
            shell=True,
            check=True
        )
        
        if result.returncode == 0:
            console.print("\n[bold green]✅ Synchronization finished successfully![/bold green]")
        else:
            console.print(f"\n[bold red]❌ Synchronization stopped with exit code {result.returncode}[/bold red]")
            
    except subprocess.CalledProcessError as e:
        console.print(f"\n[bold red]❌ Error during script execution:[/bold red] {e}")
        sys.exit(1)
    except FileNotFoundError:
        console.print("\n[bold red]❌ Error:[/bold red] `pnpm` or `tsx` not found in PATH.")
        sys.exit(1)

if __name__ == "__main__":
    run_sync()
