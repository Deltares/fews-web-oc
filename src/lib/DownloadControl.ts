import { Map, Popup } from 'mapbox-gl'

export class DownloadControl {
    bbox: any | undefined
    private _map: Map | undefined
    private _container: HTMLElement | undefined
    private _btn: HTMLButtonElement | undefined
    private _popup: mapboxgl.Popup | undefined

    constructor(bbox: any) {
        this.bbox = bbox
    }

    onAdd(map: Map) {
        this._map = map
        
        this._btn = document.createElement("button")
        this._btn.className = "mapboxgl-ctrl-download"
        this._btn.type = "button"

        const icon = document.createElement("i");
        icon.className = "fas fa-download"; 

        // Add the icon to the button
        this._btn.appendChild(icon);
        // add a function on btn click that prints bbox if defined
        this._btn.onclick = () => {
            if ( this.bbox !== undefined) {
                this._showPopup()
            } else {
                this._showErrorPopup("Select an area first to download data")
            }
        }

        this._container = document.createElement("div")
        this._container.className = "mapboxgl-ctrl-group mapboxgl-ctrl"
        this._container.appendChild(this._btn)

        return this._container
  }

  onRemove() {
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container)
    }
    this._map = undefined
  }

  private _showPopup() {
    if (!this._popup) {
        this._popup = new Popup({
            closeButton: true,
            closeOnClick: false,
            className: 'custom-popup'
        });
    }

    const popupContent = document.createElement("div");
    popupContent.innerHTML = `
            <style>
                .custom-popup {
                    font-family: 'Roboto', sans-serif; 
                    color: #333; 
                    padding: 10px;
                }

                .custom-popup label {
                    display: block;
                    margin-bottom: 5px;
                }

                .custom-popup input {
                    width: 100%;
                    padding: 5px;
                    margin-bottom: 10px;
                }

                .custom-popup button {
                    background-color: #007bff;
                    color: #fff;
                    border: none;
                    padding: 10px;
                    cursor: pointer;
                    width: 100%;
                }
                .custom-popup input[type="text"] {
                    color: black; 
                }
            </style>
            <p>Enter the resolutions dx and dy:</p>
            <label for="dx">dx:</label>
            <input type="text" id="dx" name="dx" />
            <label for="dy">dy:</label>
            <input type="text" id="dy" name="dy" />
            <button id="submit-btn">Download</button>
        `
    if (this._map) {
    this._popup.setDOMContent(popupContent)
        .setLngLat(this._map.getCenter())
        .addTo(this._map);
    }
    const submitButton = popupContent.querySelector("#submit-btn") as HTMLButtonElement;
    submitButton.onclick = () => {
        const dxInput = popupContent.querySelector("#dx") as HTMLInputElement;
        const dyInput = popupContent.querySelector("#dy") as HTMLInputElement;
        const dx = Number(dxInput.value);
        const dy = Number(dyInput.value);
        this._download(dx, dy);
        this._popup?.remove();
    };
    }

    private _download(dx: number, dy: number) {
        // change this to download the data
        console.log("dx:", dx);
        console.log("dy:", dy);
    }

    private _showErrorPopup(errorMessage: string) {
        if (!this._popup) {
            this._popup = new Popup({
                closeButton: true,
                closeOnClick: false,
                className: 'custom-popup-error'
            });
        }
    
        const popupContent = document.createElement("div");
        popupContent.innerHTML = `
            <style>
                .custom-popup-error {
                    font-family: 'Roboto', sans-serif; 
                    color: #ff0000; 
                    padding: 10px;
                }
    
                .custom-popup-error p {
                    margin: 0;
                }
    
                .custom-popup-error button {
                    background-color: #007bff;
                    color: #fff;
                    border: none;
                    padding: 10px;
                    cursor: pointer;
                    width: 100%;
                    margin-top: 10px;
                }
            </style>
            <p>${errorMessage}</p>
            <button id="close-btn">Close</button>
        `;
    
        if (this._map) {
            this._popup.setDOMContent(popupContent)
                .setLngLat(this._map.getCenter())
                .addTo(this._map);
        }
    
        const closeBtn = popupContent.querySelector("#close-btn") as HTMLButtonElement;
        closeBtn.onclick = () => {
            this._popup?.remove();
        }
    }
}


