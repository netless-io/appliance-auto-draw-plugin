# appliance-auto-draw-plugin

一个依赖于[@netless/appliance-plugin](https://www.npmjs.com/package/@netless/appliance-plugin)的自动联想简笔绘图插件。

## 安装
`` npm add @netless/appliance-auto-draw-plugin ``

## 使用
通过调用`appliance.usePlugin(plugin)`方法注册到`appliance-plugin`中。

```ts
    import { ApplianceMultiPlugin } from '@netless/appliance-plugin';
    import { AutoDrawPlugin } from '@netless/appliance-auto-draw-plugin';

    const appliancePlugin = await ApplianceMultiPlugin.getInstance(...);
    const autoDrawPlugin = new AutoDrawPlugin({
        // 挂载dom节点
        container: document.getElementById('container'),
        // 简笔联想的服务地址
        hostServer: 'https://autodraw-white-backup-hk-hkxykbfofr.cn-hongkong.fcapp.run',
        // 笔记绘制后延迟多久开始联想
        delay: 2000
    });
    appliancePlugin.usePligiun(autoDrawPlugin);
    // 开启
    autoDrawPlugin.mount();
    // 关闭
    autoDrawPlugin.unMount();
```