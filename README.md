# appliance-auto-draw-plugin
A dependent on [@netless/appliance-plugin](https://www.npmjs.com/package/@netless/appliance-plugin) automatic associations used line drawing plugin.

## Install
`` npm add @netless/appliance-auto-draw-plugin ``

## Usage
Register to `appliance-plugin` by calling the `appliance.usePlugin(plugin)` method.

```ts
    import { ApplianceMultiPlugin } from '@netless/appliance-plugin';
    import { AutoDrawPlugin } from '@netless/appliance-auto-draw-plugin';

    const appliancePlugin = await ApplianceMultiPlugin.getInstance(...);
    const autoDrawPlugin = new AutoDrawPlugin({
        // Mount the dom node
        container: document.getElementById('container'),
        // Handwritten stick figure Lenovo service address
        hostServer: 'https://autodraw-white-backup-hk-hkxykbfofr.cn-hongkong.fcapp.run',
        // How long is the delay after handwriting notes are drawn to start association
        delay: 2000
    });
    appliancePlugin.usePligiun(autoDrawPlugin);
    // turn on
    autoDrawPlugin.mount();
    // turn off
    autoDrawPlugin.unMount();
```