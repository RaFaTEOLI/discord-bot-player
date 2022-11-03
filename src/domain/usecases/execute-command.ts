export interface ExecuteCommand {
  execute: (commandId: string) => Promise<void>;
}
