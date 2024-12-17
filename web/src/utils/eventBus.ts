import mitt from 'mitt'

type Events = {
  factoryUpdated: undefined; // No payload for this event
  loggedIn: undefined; // No payload for this event
  sessionExpired: undefined;
  dataSynced: undefined;
  dataOutOfSync: undefined;
  toast: { message: string; type?: 'success' | 'error' };
};

const eventBus = mitt<Events>()

export default eventBus
