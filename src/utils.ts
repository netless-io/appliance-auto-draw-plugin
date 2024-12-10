import type { IRectType } from "@netless/appliance-plugin/dist/core/types";
export function computRect(rect1?: IRectType, rect2?: IRectType){
    if(rect1 && rect2){
      const x = Math.min(rect1.x,rect2.x);
      const y = Math.min(rect1.y,rect2.y);
      const maxX = Math.max(rect1.x+rect1.w, rect2.x+rect2.w); 
      const maxY = Math.max(rect1.y+rect1.h, rect2.y+rect2.h); 
      const w = maxX - x;
      const h = maxY - y;
      return {x,y,w,h}
    }
    return rect2 || rect1;
}