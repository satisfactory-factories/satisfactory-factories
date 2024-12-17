import mitt from 'mitt'

type Events = {
  factoryUpdated: undefined; // No payload for this event
  loggedIn: undefined; // No payload for this event
  sessionExpired: undefined;
  dataSynced: undefined;
  dataOutOfSync: undefined;
  toast: { message: string; type?: 'success' | 'error' };
  showLoading: number;
  hideLoading: undefined;
};

const eventBus = mitt<Events>()

export default eventBus
