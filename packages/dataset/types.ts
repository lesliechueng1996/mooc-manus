export enum ProcessType {
  Automatic = 'automatic',
  Custom = 'custom',
}

export enum PreProcessRuleId {
  RemoveExtraSpace = 'remove_extra_space',
  RemoveUrlAndEmail = 'remove_url_and_email',
}

export enum DocumentStatus {
  WAITING = 'waiting',
  PARSING = 'parsing',
  SPLITTING = 'splitting',
  INDEXING = 'indexing',
  COMPLETED = 'completed',
  ERROR = 'error',
}
