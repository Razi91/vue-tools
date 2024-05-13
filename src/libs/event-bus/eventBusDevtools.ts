import { setupDevtoolsPlugin, type DevtoolsPluginApi } from "@vue/devtools-api";
import { Plugin as Plugin_2, type ComponentInternalInstance } from "vue";

export const DEVTOOLS_ID = "event-bus-timeline";

type PluginOptions = {
  debugListeners: boolean;
};

let devtoolsOptions: PluginOptions | null = null;
let apiInstance: null | DevtoolsPluginApi<unknown> = null;

type LifetimeLog = {
  component: ComponentInternalInstance;
  busName: string;
  instanceName?: string | null;
  groupId: string;
};

export async function logEventbusListenerCtor(opt: LifetimeLog) {
  if (apiInstance == null || !devtoolsOptions?.debugListeners) return;
  const componentName = await apiInstance.getComponentName(opt.component);

  apiInstance.addTimelineEvent({
    layerId: DEVTOOLS_ID,
    event: {
      title: `Open`,
      time: apiInstance.now(),
      data: {
        componentName,
        busName: opt.busName,
        instanceName: opt.instanceName,
      },
      groupId: opt.groupId,
    },
  });
}
export async function logEventbusListenerDto(opt: LifetimeLog) {
  if (apiInstance == null || !devtoolsOptions?.debugListeners) return;
  const componentName = await apiInstance.getComponentName(opt.component);

  apiInstance.addTimelineEvent({
    layerId: DEVTOOLS_ID,
    event: {
      time: apiInstance.now(),
      title: `Close`,
      data: {
        componentName,
        busName: opt.busName,
        instanceName: opt.instanceName,
      },
      groupId: opt.groupId,
    },
  });
}

type ReceiveLog = {
  groupId: string;
  busName: string;
  key: string;
  payload: unknown;
};
export async function logEventBusReceived(opt: ReceiveLog) {
  if (apiInstance == null || !devtoolsOptions?.debugListeners) return;

  apiInstance.addTimelineEvent({
    layerId: DEVTOOLS_ID,
    event: {
      time: apiInstance.now(),
      data: {
        busName: opt.busName,
        key: opt.key,
        payload: opt.payload,
      },
      groupId: opt.groupId,
    },
  });
}

type EventLog = {
  key: string;
  busName: string;
  name: string | undefined | null;
  groupId?: string;
  data: unknown;
  component?: ComponentInternalInstance | null;
};

export async function logEventbusEvent(event: EventLog) {
  if (apiInstance == null) return;
  const componentName = event.component
    ? await apiInstance.getComponentName(event.component)
    : "external";

  const title = [event.busName, event.name]
    .filter((i) => i != null)
    .join(" - ");
  apiInstance.addTimelineEvent({
    layerId: DEVTOOLS_ID,
    event: {
      title: title.length > 0 ? title : "Unknown",
      subtitle: `${event.key}`,
      time: apiInstance.now(),
      groupId: event.groupId,
      data: {
        eventBus: event.busName,
        componentName,
        instanceName: event.name,
        key: event.key,
        payload: event.data,
      },
    },
  });
}

export const EventBusDevtools: Plugin_2 = {
  install(app, options: PluginOptions) {
    if (process.env.NODE_ENV === "development" || __VUE_PROD_DEVTOOLS__) {
      devtoolsOptions = options;
      const stateType = "Event Bus state";
      setupDevtoolsPlugin(
        {
          id: "vue-event-bus-plugin",
          label: "Event Bus",
          packageName: "vue-tools",
          // homepage: 'https://vuejs.org',
          componentStateTypes: [stateType],
          app: app as never,
        },
        (api) => {
          apiInstance = api as DevtoolsPluginApi<unknown>;
          api.addTimelineLayer({
            id: DEVTOOLS_ID,
            label: "Event Bus",
            color: 0xff0000,
          });
        },
      );
    }
    return;
  },
};
