import mitt from 'mitt'

type Events = {
  factoryUpdated: undefined; // No payload for this event
  loggedIn: undefined;
  sessionExpired: undefined;
  dataSynced: undefined;
  dataOutOfSync: undefined;
  toast: { message: string; type?: 'success' | 'error' };
  loadingReady: undefined;
  loadingCompleted: undefined;
  showLoading: number;
  hideLoading: undefined;
};

const eventBus = mitt<Events>()

export default eventBus
