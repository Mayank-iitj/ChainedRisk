"""
ChainedRisk Discord Bot - Remote HITL Approval & Monitoring
Allows security analysts and managers to review and approve verification cards
directly from mobile or desktop Discord.
"""
import os
import sys
import asyncio
import httpx

API_BASE_URL = os.environ.get("CR_API_URL", "http://localhost:8000/api/v1")
DISCORD_TOKEN = os.environ.get("DISCORD_BOT_TOKEN", "")

def run_bot():
    if not DISCORD_TOKEN:
        print("[!] DISCORD_BOT_TOKEN not provided in environment. Running in webhook simulation mode.")
        print("[+] Discord interaction endpoint is live at /api/v1/integrations/discord/interactions")
        return

    try:
        import discord
        from discord import app_commands
        from discord.ext import commands
    except ImportError:
        print("[!] discord.py not installed. Run: pip install discord.py")
        return

    intents = discord.Intents.default()
    bot = commands.Bot(command_prefix="!", intents=intents)

    class ApprovalView(discord.ui.View):
        def __init__(self, card_id: str):
            super().__init__(timeout=600)
            self.card_id = card_id

        @discord.ui.button(label="Approve & Run", style=discord.ButtonStyle.green, emoji="✅")
        async def approve(self, interaction: discord.Interaction, button: discord.ui.Button):
            username = interaction.user.name
            async with httpx.AsyncClient() as client:
                res = await client.post(
                    f"{API_BASE_URL}/approvals/{self.card_id}/approve",
                    json={"justification": f"Approved via Discord by @{username}"}
                )
            if res.status_code == 200:
                await interaction.response.send_message(
                    f"✅ **Card {self.card_id} Approved** by @{username}. Runner token issued.",
                    ephemeral=False
                )
                self.stop()
            else:
                await interaction.response.send_message(
                    f"⚠️ Approval failed: {res.text}", ephemeral=True
                )

        @discord.ui.button(label="Deny", style=discord.ButtonStyle.red, emoji="🛑")
        async def deny(self, interaction: discord.Interaction, button: discord.ui.Button):
            username = interaction.user.name
            async with httpx.AsyncClient() as client:
                res = await client.post(
                    f"{API_BASE_URL}/approvals/{self.card_id}/deny",
                    json={"reason": f"Denied via Discord by @{username}"}
                )
            if res.status_code == 200:
                await interaction.response.send_message(
                    f"🛑 **Card {self.card_id} Denied** by @{username}. Execution aborted.",
                    ephemeral=False
                )
                self.stop()
            else:
                await interaction.response.send_message(
                    f"⚠️ Deny failed: {res.text}", ephemeral=True
                )

    @bot.tree.command(name="status", description="Get ChainedRisk platform status")
    async def status_cmd(interaction: discord.Interaction):
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{API_BASE_URL}/config/public")
        if res.status_code == 200:
            data = res.json()
            embed = discord.Embed(title="🛡️ ChainedRisk Platform Status", color=0x00f0ff)
            embed.add_field(name="Scope", value=f"`{data.get('lab_cidr')}` (lab-only)", inline=True)
            embed.add_field(name="Emergency Lock", value="ACTIVE" if data.get('kill_locked') else "Normal", inline=True)
            embed.add_field(name="LLM Mode", value="Enabled" if data.get('llm_enabled') else "Rules Only", inline=True)
            await interaction.response.send_message(embed=embed)
        else:
            await interaction.response.send_message("Failed to connect to ChainedRisk API.")

    @bot.tree.command(name="pending", description="List pending HITL approval cards")
    async def pending_cmd(interaction: discord.Interaction):
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{API_BASE_URL}/approvals?status=pending")
        if res.status_code == 200:
            cards = res.json()
            if not cards:
                await interaction.response.send_message("✅ No pending approval cards.")
                return
            for c in cards:
                embed = discord.Embed(title=f"⚠️ [{c.get('risk_level')}] Approval Required", color=0xf59e0b)
                embed.add_field(name="Command", value=f"```bash\n{c.get('command')}\n```", inline=False)
                embed.add_field(name="Target", value=f"{c.get('target', {}).get('container')} ({c.get('target', {}).get('ip')})", inline=True)
                embed.add_field(name="Blast Radius", value=f"{c.get('blast_radius', {}).get('score')}/100", inline=True)
                embed.add_field(name="Reason", value=c.get('reason', 'N/A'), inline=False)
                view = ApprovalView(card_id=c.get("id"))
                await interaction.response.send_message(embed=embed, view=view)
        else:
            await interaction.response.send_message("Failed to fetch approvals.")

    @bot.tree.command(name="kill", description="Emergency stop all runners and lock system")
    async def kill_cmd(interaction: discord.Interaction, reason: str = "Operator emergency stop via Discord"):
        async with httpx.AsyncClient() as client:
            res = await client.post(f"{API_BASE_URL}/kill?reason={httpx.URL(reason)}")
        if res.status_code == 200:
            await interaction.response.send_message(f"🚨 **EMERGENCY KILL SWITCH ACTIVATED**\nReason: {reason}")
        else:
            await interaction.response.send_message("Failed to activate kill switch.")

    @bot.event
    async def on_ready():
        await bot.tree.sync()
        print(f"[+] ChainedRisk Discord Bot logged in as {bot.user}")

    bot.run(DISCORD_TOKEN)

if __name__ == "__main__":
    run_bot()

