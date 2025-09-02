import io from 'socket.io-client/dist/socket.io.js';
import { _decorator, Component, log, Node } from 'cc';
import { DEBUG } from 'cc/env';

const { ccclass, property } = _decorator;

@ccclass('SocketIOClient')
export default class SocketIOClient {
    private socket: any = null;
    private connecting: boolean = false;
    private reconnecting: boolean = false;
    private listeners: Array<Listener> = new Array<Listener> ();
    private maxReconnectAttempts: number = 100;

    constructor() {

    }

    Initialize (url: string, _maxReconnect?: number) {
        
        if (_maxReconnect) this.maxReconnectAttempts = _maxReconnect;

        this.socket = io(url, {
            // cors: {
            //     origin: "*",
            //     methods: ["GET", "POST"]
            // },
            transports: ["websocket"],
            upgrade: false,
            rejectUnauthorized: false, // this is nodejs only option, will not bypass in browser
            reconnection: false, // default true, if set to false will need to reconnect manually
            reconnectionAttempts: 1, // default infinity
            reconnectionDelay: 1000, // default 1000
            reconnectionDelayMax: 5000, // default 5000
            timeout: 10000, // default 20000
            autoConnect: false, // manually connect, this.socket.io.open() / this.socket.connect()
        });

        // Socket IO events
        // ================
        
        this.socket.on ("connect", () => {
            if (this.socket != null) {
                this.Log ("Connected to server");
                if (this.connecting) {
                    this.connecting = false;
                    this._onConnected (this.socket.id);
                }
            }
        });

        this.socket.on ("connect_error", (data: any) => {
            if (this.socket != null) {
                this.Log ("Connect error: ", data.toString());
                this._onConnectError ();
                if (this.connecting) {
                    this.Disconnect ();
                }
            }
        });
        this.socket.on ("connect_timeout", (data: any) => {
            if (this.socket != null) {
                this.Log ("Connect timeout: ", data.toString());
                this._onConnectError ();
                if (this.connecting) {
                    this.Disconnect ();
                }
            }
        });
        this.socket.on ("disconnect", (data: any) => {
            if (this.socket != null) {
                this.Log ("Client disconnected: ", data?.toString());
                let isServerDisconnected: boolean = "io server disconnect" == data?.toString();
                this._onDisconnected (data.toString(), isServerDisconnected);
                if (isServerDisconnected) {
                    this.Disconnect ();
                }
            }
        });

        this.socket.on ("reconnect", () => {
            if (this.socket != null) {
                this.reconnecting = false;
                this.Log ("Reconnected to server");
                this._onReconnected ();
            }
        });

        this.socket.on ("reconnect_attempt", (data: number) => {
            if (this.socket != null) {
                this.Log ("Reconnect attempts: ", data.toString());
                this.reconnecting = true;
                let reconnectAttempts: number = data;
                this._onReconnectAttempt (reconnectAttempts);
                if (reconnectAttempts > this.maxReconnectAttempts) {
                    this.Disconnect ();
                }
            }
        });
        
        this.socket.on ("error", (data: any) => {
            if (this.socket != null) {
                this.Log ("Socket error: ", data.toString());
                this._onConnectError ();
                if (this.connecting) {
                    this.Disconnect ();
                }
            }
        });
    }

    Connect () {
        this.connecting = true;
        this.socket.connect ();
    }

	Disconnect () {
		this.connecting = false;

		if (this.socket != null) {
			this.socket.disconnect();
			this.socket.off;
			this.socket = null;
		}
	}

	IsConnected () : boolean {
		return this.socket != null && this.socket.io.readyState == "open"; // io.Manager.ReadyStateEnum.OPEN
	}

	IsReconnecting () : boolean {
		return this.reconnecting;
	}

	GetSocketID () : string{
		if (this.socket != null) {
			return this.socket.id;
		}
		return null;
	}

    RequestEvent (eventName: string, data: any) {
        this.socket.emit(eventName, data);
	}

    // =====================================================================
    // SocketIO network event listeners
    // #region
    // =====================================================================

    AddListener (customEventName: string, callback: (data)=>void) {
        this.socket.on(customEventName, callback);
    }
    
    RemoveListener (customEventName: string) {
        this.socket.off(customEventName);
    }

	AddClientListener (listener: Listener) {
		this.listeners.push (listener);
	}

	RemoveClientListener (listener: Listener) {
		let index = this.listeners.findIndex((item) => {return listener == listener});
        this.listeners.splice(index);
	}

    private _onConnected (socketID: string) {
		this.listeners.forEach ((listener) => {
			listener.OnConnected (socketID);
		});
	}
    
	private _onDisconnected (reason: string, isServerDisconnected: boolean) {
		this.listeners.forEach ((listener) => {
			listener.OnDisconnected (reason, isServerDisconnected);
		});
	}

	private _onConnectError () {
		this.listeners.forEach ((listener) => {
			listener.OnConnectError ();
		});
	}

	private _onReconnected () {
		this.listeners.forEach ((listener) => {
			listener.OnReconnected ();
		});
	}

	private _onReconnectAttempt (attempt: number) {
		this.listeners.forEach ((listener) => {
			listener.OnReconnectAttempt (attempt);
		});
	}

    // #endregion
    // =====================================================================

    

    // =====================================================================
    // SocketIO private functions
    // #region
    // =====================================================================

    private Log (...message: any[]) {
        if (DEBUG) log("{", SocketIOClient.name, "}", ...message);
    }

    // #endregion
    // =====================================================================
}


/**
 * SocketIO connection listener
 */
export interface Listener {
    OnConnected (socketID: string) : void;
    OnDisconnected (reason: string, isServerDisconnected: boolean) : void;
    OnConnectError () : void;
    OnReconnectAttempt (attempt: number) : void;
    OnReconnected () : void;
}

