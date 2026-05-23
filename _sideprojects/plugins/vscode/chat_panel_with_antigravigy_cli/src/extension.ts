import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';

/**
 * Executes the real Anti-Gravity CLI (agy) using child_process.spawn.
 * Pipes the prompt and context into stdin as JSON.
 * Streams the stdout chunks back to the VS Code Chat.
 * If agy is not installed, gracefully falls back to a simulated response and setup guide.
 */
async function* executeAntigravityCLI(prompt: string, context: string): AsyncGenerator<string, void, unknown> {
    const payload = JSON.stringify({ prompt, context });
    
    let isCommandNotFound = false;
    let stdoutYieldedCount = 0;

    // Queue structure to handle asynchronous streaming from process events
    const queue: string[] = [];
    let resolveNext: ((value: void) => void) | null = null;
    let isDone = false;
    let error: Error | null = null;
    let exitCode: number | null = null;

    try {
        // Spawn agy CLI directly without shell: true to avoid shell process deadlocks.
        // On Windows, global npm/pnpm commands are wrapped in '.cmd' files, so we invoke 'agy.cmd' directly.
        const commandName = process.platform === 'win32' ? 'agy.cmd' : 'agy';
        const child = spawn(commandName, ['vscode-chat']);

        child.stdout.on('data', (data) => {
            const text = data.toString();
            queue.push(text);
            stdoutYieldedCount++;
            if (resolveNext) {
                resolveNext();
                resolveNext = null;
            }
        });

        child.stderr.on('data', (data) => {
            console.error(`agy stderr: ${data.toString()}`);
        });

        child.on('error', (err: any) => {
            if (err.code === 'ENOENT' || err.code === 'EINVAL') {
                isCommandNotFound = true;
            } else {
                error = err;
            }
            isDone = true;
            if (resolveNext) {
                resolveNext();
                resolveNext = null;
            }
        });

        child.on('close', (code) => {
            exitCode = code;
            isDone = true;
            if (resolveNext) {
                resolveNext();
                resolveNext = null;
            }
        });

        // Pipe our payload safely to stdin
        child.stdin.write(payload);
        child.stdin.end();

        // Keep yielding as chunks arrive
        while (!isDone || queue.length > 0) {
            if (queue.length > 0) {
                yield queue.shift()!;
            } else {
                await new Promise<void>((resolve) => {
                    resolveNext = resolve;
                });
            }
        }

        // On Windows (cmd.exe), command not found exits with 9009. On Unix/Mac, it exits with 127.
        // If no output was yielded and we exited with one of these codes, trigger the fallback.
        if ((exitCode === 9009 || exitCode === 127) && stdoutYieldedCount === 0) {
            isCommandNotFound = true;
        }

        if (error) {
            throw error;
        }

    } catch (err: any) {
        if (err.code === 'ENOENT' || err.code === 'EINVAL') {
            isCommandNotFound = true;
        } else {
            throw err;
        }
    }

    // Graceful Fallback if agy CLI is not installed or not in PATH
    if (isCommandNotFound) {
        yield `### 🪐 Anti-Gravity CLI (\`agy\`) Not Found\n\n`;
        yield `It looks like the **Anti-Gravity CLI** (\`agy\` command) is not installed in your system's PATH yet.\n\n`;
        yield `> [!IMPORTANT]\n`;
        yield `> **How to connect your actual CLI:**\n`;
        yield `> 1. Make sure you have the Anti-Gravity CLI tool installed globally on your machine.\n`;
        yield `> 2. Ensure that the \`agy\` command is accessible from your command line terminal.\n`;
        yield `> 3. Restart or reload VS Code, and \`@antigravity\` will automatically connect and stream live responses from your CLI! 🚀\n\n`;
        yield `---\n\n`;
        yield `*Currently showing simulated mockup response:*\n\n`;

        const mockLines = [
            `# 🪐 Anti-Gravity CLI - Execution Simulation\n\n`,
            `Hello from the **Anti-Gravity Coding Assistant**! 🛸\n\n`,
            `I have successfully intercepted your prompt and retrieved the active editor context. Here is the mock execution breakdown:\n\n`,
            `### 💬 Your Prompt\n`,
            `> ${prompt || '*No prompt provided*'}\n\n`,
            `### 📂 Code Context Captured\n`,
            `${context}\n\n`,
            `---\n\n`,
            `### 🚀 Suggested Action & Analysis\n`,
            `Based on the context, here are the simulated recommendations from the **Anti-Gravity Engine**:\n\n`,
            `- **Rule Enforcement**: The strict scope rules are checked. Zero collateral changes detected. 💎\n`,
            `- **Optimization**: Consider using native TypeScript features for robust type safety.\n`,
            `- **Refactoring Proposal**:\n`,
            `  \`\`\`typescript\n`,
            `  // Anti-Gravity optimized stub\n`,
            `  async function handleAntigravityRequest(prompt: string): Promise<string> {\n`,
            `      console.log("Processing prompt:", prompt);\n`,
            `      return "Successfully executed!";\n`,
            `  }\n`,
            `  \`\`\`\n\n`,
            `> [!NOTE]\n`,
            `> This response was generated by a mock placeholder of the \`executeAntigravityCLI\` function.\n`,
            `> In the next phase, we will connect this to the real Anti-Gravity CLI tool! 🌟`
        ];

        for (const line of mockLines) {
            yield line;
            await new Promise(resolve => setTimeout(resolve, 80));
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "chat-panel-with-antigravity-cli" is now active!');

    // Register the chat participant '@antigravity'
    const participant = vscode.chat.createChatParticipant(
        'antigravity.chatParticipant',
        async (request: vscode.ChatRequest, context: vscode.ChatContext, response: vscode.ChatResponseStream, token: vscode.CancellationToken) => {
            // 1. Gather active editor context
            const activeEditor = vscode.window.activeTextEditor;
            let fileContext = '*No active editor open*';

            if (activeEditor) {
                const document = activeEditor.document;
                const fileName = path.basename(document.fileName);
                const languageId = document.languageId;
                
                // Get selected text if any, otherwise get the whole file content (up to 500 lines)
                const selection = activeEditor.selection;
                const selectedText = document.getText(selection);
                const fullText = document.getText();
                
                if (selectedText.trim().length > 0) {
                    fileContext = `**File:** \`${fileName}\` (${languageId})\n` +
                                  `**Selection (Lines ${selection.start.line + 1} - ${selection.end.line + 1}):**\n` +
                                  `\`\`\`${languageId}\n${selectedText}\n\`\`\``;
                } else {
                    const lines = fullText.split('\n');
                    const truncatedText = lines.slice(0, 500).join('\n');
                    const isTruncated = lines.length > 500;
                    
                    fileContext = `**File:** \`${fileName}\` (${languageId})\n` +
                                  `**Full Content (showing first 500 lines):**\n` +
                                  `\`\`\`${languageId}\n${truncatedText}${isTruncated ? '\n... (truncated)' : ''}\n\`\`\``;
                }
            }

            // 2. Print initial status line
            response.markdown(new vscode.MarkdownString('🪐 *Analysing context and running Anti-Gravity CLI...*\n\n'));

            try {
                // 3. Call our function to execute and stream response (either from agy CLI or fallback mockup)
                const generator = executeAntigravityCLI(request.prompt, fileContext);
                for await (const chunk of generator) {
                    // Check if user cancelled the request
                    if (token.isCancellationRequested) {
                        break;
                    }
                    response.markdown(new vscode.MarkdownString(chunk));
                }
            } catch (error) {
                response.markdown(new vscode.MarkdownString(`\n\n❌ **Error during execution:** ${error instanceof Error ? error.message : String(error)}`));
            }
        }
    );

    // Set an icon path if available
    participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'antigravity-icon.png');

    context.subscriptions.push(participant);
}

export function deactivate() {}
