import { Timeframe } from "../Collections/Timeframe";
import { ActivitySetFile } from "./ActivitySetFileTypes";
import { ActivitySetClassification } from "@/store/StoreTypes";

export class ActivitySetInfo {
    
    public id: string;
    public score: ActivitySetClassification;
    public events: number;
    public analytics: number;
    public users: Map<string, number>;
    public hosts: Map<string, number>;
    public tactics: Map<string, number>;
    public techniques: Map<string, number>;
    public duration: Timeframe;
    
    /**
     * Creates a new ActivitySetInfo.
     * @param file
     *  The activity set file.
     * @param score
     *  The score of the activity set.
     */
    constructor(file: ActivitySetFile, score: ActivitySetClassification) {
        let beg = 8640000000000000;
        let end = -8640000000000000;
        let analytics = (file.analytic_results ?? file.alerts)!;
        
        // Id, Events, Analytics
        this.id = file.activity_set_id;
        this.events = file.events.length;
        this.analytics = analytics.length;
        this.users = new Map();
        this.hosts = new Map();
        this.tactics = new Map();
        this.techniques = new Map();
        
        for(let e of file.events) {
            // Users
            if(!this.users.has(e.user)) {
                this.users.set(e.user, 0);
            }
            this.users.set(e.user, this.users.get(e.user)! + 1);
            // Hosts
            if(!this.hosts.has(e.host)) {
                this.hosts.set(e.host, 0);
            }
            this.hosts.set(e.host, this.hosts.get(e.host)! + 1);
            // Time
            beg = Math.min(beg, e.time.getTime());
            end = Math.max(end, e.time.getTime());
        }

        for(let a of analytics) {
            // Tactics
            let at = a.attack_tactic;
            if(!this.tactics.has(at)) {
                this.tactics.set(at, 0);
            }
            this.tactics.set(at, this.tactics.get(at)! + 1);
            // Techniques
            let ati = a.attack_technique_id;
            if(!this.techniques.has(ati)){
                this.techniques.set(ati, 0);
            }
            this.techniques.set(ati, this.techniques.get(ati)! + 1)
        }

        // Duration
        this.duration = new Timeframe(new Date(beg), new Date(end));

        // Score
        this.score = score;

    }

}
