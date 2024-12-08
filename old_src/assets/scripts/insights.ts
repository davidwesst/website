import { ApplicationInsights } from "@microsoft/applicationinsights-web";

class Insights {
    private readonly KEY_COOKIES_ACCEPTED: string = "cookies_accepted";
    
    private appInsights: ApplicationInsights;

    get cookiesAccepted(): boolean {
        const parsedValue = Number.parseInt(window.localStorage.getItem(this.KEY_COOKIES_ACCEPTED))
        if(!Number.isNaN(parsedValue) && parsedValue === 1) {
            return true;
        }
        else {
            return false;
        }
    }

    private set cookiesAccepted(val: boolean) {
        const storageValue = (val) ? 1 : 0;
        window.localStorage.setItem(this.KEY_COOKIES_ACCEPTED, storageValue.toString());
    }
    
    constructor() {
        this.appInsights = new ApplicationInsights({ config: {
          connectionString: process.env.AI_CONNECTION_STRING,
          enableCorsCorrelation: true,
          enableRequestHeaderTracking: true,
          enableResponseHeaderTracking: true,
          enableUnhandledPromiseRejectionTracking: true,
          disableCookiesUsage: !this.cookiesAccepted
        }});

        this.showCookieAcceptanceDialogue();
        this.appInsights.loadAppInsights();
        this.appInsights.trackPageView(); // Manually call trackPageView to establish the current user/session/pageview
    }

    showCookieAcceptanceDialogue() {
        // if user has no setting regarding cookies
        if(window.localStorage.getItem(this.KEY_COOKIES_ACCEPTED) === null) {
            // get dialogue elements
            const cookieDialogueEl : HTMLDialogElement = document.getElementById("cookieDialogue") as HTMLDialogElement;
            const acceptBtnEl : HTMLButtonElement = document.getElementById("btnCookieAccept") as HTMLButtonElement;
            const rejectBtnEl : HTMLButtonElement = document.getElementById("btnCookieReject") as HTMLButtonElement;

            // attach event handlers
            acceptBtnEl.addEventListener("click", ()=> {
                this.cookiesAccepted = true;
                this.appInsights.getCookieMgr().setEnabled(true);
                this.appInsights.trackEvent({ name: "cookie_accept" });
            });
            rejectBtnEl.addEventListener("click", ()=> {
                this.cookiesAccepted = false;
                this.appInsights.getCookieMgr().setEnabled(false);
                this.appInsights.trackEvent({ name: "cookie_reject" });
            });

            // show dialogue
            cookieDialogueEl.show();
        }
    }
}
export default Insights;

