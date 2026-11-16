import { contextBridge, ipcRenderer } from 'electron';

const api = {
  // Mailboxes
  listMailboxes: () => ipcRenderer.invoke('mailboxes:list'),
  detectProvider: (email: string) => ipcRenderer.invoke('mailboxes:detect', email),
  createMailbox: (data: any) => ipcRenderer.invoke('mailboxes:create', data),
  updateMailbox: (data: any) => ipcRenderer.invoke('mailboxes:update', data),
  deleteMailbox: (id: string) => ipcRenderer.invoke('mailboxes:delete', id),
  testMailboxConnection: (data: any) => ipcRenderer.invoke('mailboxes:test', data),

  // Campaigns
  listCampaigns: () => ipcRenderer.invoke('campaigns:list'),
  getCampaign: (id: string) => ipcRenderer.invoke('campaigns:get', id),
  createCampaign: (data: any) => ipcRenderer.invoke('campaigns:create', data),
  updateCampaign: (data: any) => ipcRenderer.invoke('campaigns:update', data),
  deleteCampaign: (id: string) => ipcRenderer.invoke('campaigns:delete', id),

  // Contacts
  importContacts: (data: any) => ipcRenderer.invoke('contacts:import', data),
  listContacts: (data: any) => ipcRenderer.invoke('contacts:list', data),
  getContactStats: (campaignId: string) => ipcRenderer.invoke('contacts:stats', campaignId),

  // Execution
  startCampaign: (campaignId: string) => ipcRenderer.invoke('execution:start', campaignId),
  pauseCampaign: () => ipcRenderer.invoke('execution:pause'),
  resumeCampaign: () => ipcRenderer.invoke('execution:resume'),
  stopCampaign: () => ipcRenderer.invoke('execution:stop'),
  getExecutionStatus: () => ipcRenderer.invoke('execution:status'),

  // Logs
  listLogs: (data?: any) => ipcRenderer.invoke('logs:list', data),
  clearLogs: (campaignId?: string) => ipcRenderer.invoke('logs:clear', campaignId),

  // Templates
  previewTemplate: (template: string, recipient: any) => 
    ipcRenderer.invoke('template:preview', { template, recipient }),

  // Subscriptions / Listeners
  onCampaignProgress: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('campaign:progress', listener);
    return () => ipcRenderer.removeListener('campaign:progress', listener);
  },
  onCampaignLog: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('campaign:log', listener);
    return () => ipcRenderer.removeListener('campaign:log', listener);
  },
  onCampaignStatusChanged: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('campaign:status_changed', listener);
    return () => ipcRenderer.removeListener('campaign:status_changed', listener);
  },
  onNavigateDashboard: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('navigate:dashboard', listener);
    return () => ipcRenderer.removeListener('navigate:dashboard', listener);
  }
};

contextBridge.exposeInMainWorld('api', api);

export type ElectronAPI = typeof api;
