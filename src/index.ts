import type { IRectType } from "@netless/appliance-plugin/dist/core";
import { EToolsKey, Plugin } from "@netless/appliance-plugin";
import { computRect } from "./utils";

export type autdrawRect = {
    centerX: number;
    centerY: number;
    width: number;
    height: number;
}
export type PointX = number;
export type PointY = number;
export type PointTimer = number;

export type AutdrawInk = [Array<PointX>, Array<PointY>, Array<PointTimer>]

export type BatchDrawInfo = {
    rect: {
        centerX: number;
        centerY: number;
        width: number;
        height: number;
    },
    ink: AutdrawInk[]
}

export type AutoDrawOptions = {
    hostServer: string;
    container: HTMLDivElement;
    delay?: number;
}

export class AutoDrawPlugin extends Plugin {
    readonly kind = "autoDraw";
    private localStorage: string[] = [];
    private excludeStorage: string[] = [];
    private timer?:number;
    private hostServer: string;
    private iconsContainer: HTMLDivElement;
    private icons: string[] = [];
    private iconRect?: autdrawRect;
    private isActive: boolean = false;
    private viewId: string = 'mainView';
    private scenePath?: string;
    private delay: number = 3000;
    constructor(options: AutoDrawOptions) {
        super();
        const {container, hostServer, delay} = options;
        this.hostServer = hostServer;
        this.iconsContainer = container;
        this.delay = delay || 3000;
    }
    get collector() {
        return this.control.collector;
    }
    onDestroy(): void {
       this.timer && clearTimeout(this.timer);
       this.timer = undefined;
       if (this.iconRect) {
           this.iconRect = undefined;
       }
       this.icons.length = 0;
       this.excludeStorage.length = 0;
       this.localStorage.length = 0;
       this.unMount();
    }
    onCreate(): void {}
    private onSetToolkey(key: EToolsKey): void {
        if (key === EToolsKey.Pencil) {
            this.isActive = true;
        } else {
            if (this.isActive) {
                this.localStorage.length = 0;
                this.timer && clearTimeout(this.timer);
                this.timer = undefined;
                if (this.iconRect) {
                    this.iconRect = undefined;
                }
                this.icons.length = 0;
            }
            this.isActive = false;
        }
    }
    private syncStorage(viewId: string, scenePath?: string){
        if (!this.isActive || viewId !== this.viewId) {
            return ;
        }
        if (!scenePath) {
            this.localStorage.length = 0;
            return;
        }
        const ids = this.getOwnStorage(this.viewId, scenePath);
        this.localStorage = ids.map(id=>this.collector?.getLocalId(id) || id);
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(async () => {
            this.timer = undefined;
            const info = await this.batchLocalDraw();
            if (!info) {
                return;
            }
            await this.computAutoDraw(info);
            this.buildHTML();
        }, this.delay);
    }
    private getOwnStorage(viewId?: string, scenePath?: string){
        if (!viewId || !scenePath) {
            return [];
        }
        const storage = this.collector?.storage[viewId]?.[scenePath];
        if (!storage) {
            return [];
        }
        const ids = Object.keys(storage).filter((id) => this.collector?.isOwn(id) && storage[id]?.toolsType === EToolsKey.Pencil && !this.excludeStorage.includes(id));
        return ids;
    }
    private async batchLocalDraw():Promise<BatchDrawInfo|undefined> {
        if (this.localStorage.length === 0) {
            return ;
        }
        if (!this.scenePath) {
            return ;
        }
        const storage = this.collector?.getStorageData(this.viewId, this.scenePath);
        if (!storage) {
            return undefined;
        }
        const _uuid = this.localStorage.toString();
        const info = await this.control.worker.getVNodeInfo(this.localStorage.toString(), this.viewId, this.localStorage)
        if (!info) {
            return undefined;
        }
        const {vInfo, uuid} = info;
        if (uuid === _uuid && vInfo) {
            const result: BatchDrawInfo = {
                rect: {
                    centerX: 0,
                    centerY: 0,
                    width: 0,
                    height: 0
                },
                ink: []
            };
            let r:IRectType|undefined;
            const timerStamp: number[] = [];
            for (const {rect, op} of vInfo) {
                r = computRect(r, rect);
                const pointsX: number[] = [];
                const pointsY: number[] = [];
                for (let i = 0; i < op.length; i+=3) {
                    pointsX.push(op[i]);
                    pointsY.push(op[i+1]);
                    const lastTimerStamp = timerStamp.length && timerStamp[timerStamp.length-1] || 0;
                    if (i === 0) {
                        if (timerStamp.length === 0) {
                            timerStamp.push(0);
                        } else {
                            timerStamp.push(lastTimerStamp + 100);
                        }
                    } else {
                        timerStamp.push(lastTimerStamp + 15);
                    }
                }
                result.ink.push([pointsX, pointsY, timerStamp]);
            }
            if (r) {
                result.rect.centerX = Math.floor(r.x + r.w / 2);
                result.rect.centerY = Math.floor(r.y + r.h / 2);
                result.rect.width = Math.floor(r.w);
                result.rect.height = Math.floor(r.h);
            }
            return result
        }
    }
    private async computAutoDraw(info: BatchDrawInfo){
        const {rect, ink} = info;
        this.iconRect = rect;
        const icons = await fetch(this.hostServer, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                width: rect.width,
                height: rect.height,
                ink
            })
        }).then((response) => response.json()).then(r=>r.data);
        this.icons = icons || [];
    }
    private buildHTML(){
        this.iconsContainer.innerHTML = "";
        const box = document.createElement("div");
        box.style.display = "flex";
        box.style.overflow = "auto";
        box.style.padding = "10px 0";
        this.icons.forEach((icon)=>{
            const iconElement = document.createElement("img");
            iconElement.src = `https://api.iconify.design/${icon}.svg?color=%237f7f7f`;
            iconElement.onclick = () => {
                this.onClickIcon(icon);
            }
            iconElement.onload = () => {
                box.appendChild(iconElement);
            }
        });
        this.iconsContainer.appendChild(box);
    }
    private onClickIcon(iconName: string){
        if (this.iconRect) {
            const point:[number,number] = this.control.viewContainerManager.transformToScenePoint([this.iconRect.centerX, this.iconRect.centerY], this.viewId);
            const scale = this.control.viewContainerManager.getView(this.viewId)?.cameraOpt?.scale || 1;
            this.control.insertIconify(this.viewId,{
                uuid: Date.now().toString(),
                centerX: point[0],
                centerY: point[1],
                width: Math.floor(this.iconRect.width / scale),
                height: Math.floor(this.iconRect.height / scale),
                src: `https://api.iconify.design/${iconName}.svg`,
                locked: false
            });
            this.iconRect = undefined;
            this.icons.length = 0;
            this.iconsContainer.innerHTML = "";
            this.control.worker.removeNodes(this.viewId, this.localStorage);
            this.localStorage.length = 0;
        }
    }
    private sceneChange(viewId: string, scenePath: string){
        if (viewId === this.viewId) {
            this.scenePath = scenePath;
            this.excludeStorage = this.getOwnStorage(viewId, scenePath);
        }
        this.localStorage.length = 0;
    }
    mount(): void {
        this.scenePath = this.control.viewContainerManager.getView(this.viewId)?.focusScenePath;
        this.excludeStorage = this.getOwnStorage(this.viewId, this.scenePath);
        const key = this.control.worker.currentToolsData?.toolsType;
        key && this.onSetToolkey(key);
        this.callbacks("setToolkey", this.onSetToolkey.bind(this));
        this.callbacks("syncStorage", this.syncStorage.bind(this));
        this.callbacks("sceneChange", this.sceneChange.bind(this));
    }
    unMount(){
        this.removeCallback("setToolkey");
        this.removeCallback("syncStorage");
        this.removeCallback("sceneChange");
    }
}