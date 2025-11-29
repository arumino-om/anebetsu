export interface Plugin {
  id: string;
  url: string;
  entryFunction: string;
}

export interface AnebetsuWorkerMessage {
  type: "RESULT" | "ERROR" | "READY";
  payload: any;
}

export interface AnebetsuPluginResult {
  type: "success" | "error";
  payload: any;
}
