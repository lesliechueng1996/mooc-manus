export type GetStatusResponse = {
  service: string;
  status: 'ok' | 'error';
  details: string;
};
