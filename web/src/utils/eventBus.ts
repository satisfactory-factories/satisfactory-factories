import mitt from 'mitt'

type Events = {
  factoryUpdated: undefined; // No payload for this event
  loggedIn: undefined; // No payload for this event
  dataSynced: undefined;
  dataOutOfSync: undefined;
};

const eventBus = mitt<Events>()

export default eventBus
