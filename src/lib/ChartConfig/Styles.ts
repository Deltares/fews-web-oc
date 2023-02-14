import * as CSS from "csstype";

export function cssLineStyleFromFEWS(lineStyle: string): CSS.SvgPropertiesHyphen {
    const style: CSS.SvgPropertiesHyphen = {}
    
    style['fill'] = "none" 

    if (lineStyle.includes('thick')){
        style['stroke-width'] = '2px'
    } else {
        style['stroke-width'] = '1px'
    }
    
    switch (lineStyle){
        case "none":
        case "solid":
            break;
        case "dashed":
            style['stroke-dasharray'] = '5 5'
            break;
        case "dashdot":
            style['stroke-dasharray'] = '5 5 1 5'
            break;
        case "dotted":
            style['stroke-dasharray'] = '1 5'
            break;
    }
    return style
}
