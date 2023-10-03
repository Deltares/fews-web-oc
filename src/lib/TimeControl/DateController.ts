export class DateController {
    dates!: Date[]
    currentTime!: Date

    constructor (dates: Date[]) {
        this.dates = dates
    }

    getMatchingDate(date: Date): number {
        if (date === undefined) return -1
        for (let i = 0; i < this.dates.length - 1; i++) {
            if (this.dates[i].getTime() <= date.getTime() && this.dates[i + 1].getTime() > date.getTime()) {
                return i
            }
        }
        return -1;
    }
    selectDate (date: Date): void {
        if(date===undefined){
            console.log("dd")
        }
        if (this.dates === undefined || this.dates.length === 0) return
        const index = this.getMatchingDate(date)
        if (index === -1) {
            if (this.dates[0].getTime() > date.getTime()) {
                this.currentTime = this.dates[0]
            } else {
                this.currentTime = this.dates[this.dates.length - 1]
            }
        } else {
            if (this.currentTime !== this.dates[index]) {
                this.currentTime = this.dates[index]
            }
        }
    }
}
