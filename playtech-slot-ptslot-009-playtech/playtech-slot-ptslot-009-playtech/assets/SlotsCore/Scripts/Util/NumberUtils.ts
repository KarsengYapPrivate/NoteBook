export default class NumberUtils
{
    public static CurrencySymbol: string = "";
    public static Currency: string = "MYR";
    public static DecimalPlaces: number = 2;
    private static FormatFourSignificantFigures = { minimumSignificantDigits: 4, maximumSignificantDigits: 4};

    // No decimal places
    public static FormatMoneyStringUltraCompact(amount: number): string {
        if (typeof (amount) === "string") {
            amount = parseFloat(amount);
        }
        
        let symbols = ["", "K", "M", "B", "T"];
        let count = 0;
        let negativeSymbol = (amount < 0) ? "-" : "";
        amount = Math.abs(amount);
            while (amount >= 1000 && count < symbols.length) {
            amount /= 1000;
            count++;
        }
        let formattedString: string;
        var amountstring = Math.round(amount).toString();
        formattedString = `${negativeSymbol}${NumberUtils.CurrencySymbol}${amountstring}${symbols[count]}`;
        return formattedString;
    }
    
    public static FormatMoneyStringCompact(amount: number): string {
        if (typeof (amount) === "string") {
            amount = parseFloat(amount);
        }
        if (amount < 10000) {
           return this.FormatMoneyString(amount);
        } else {
            let symbols = ["", "K", "M", "B", "T"];
            let count = 0;
            let negativeSymbol = (amount < 0) ? "-" : "";
            amount = Math.abs(amount);
                while (amount >= 1000 && count < symbols.length) {
                amount /= 1000;
                count++;
            }
            let formattedString: string;
            var amountstring = amount.toLocaleString(undefined, NumberUtils.FormatFourSignificantFigures);

            // If .00, then skip the .00
            if (amountstring[amountstring.length-1]=='0' && amountstring[amountstring.length-2]=='0') amountstring = Math.floor(amount).toString();

            formattedString = `${negativeSymbol}${NumberUtils.CurrencySymbol}${amountstring}${symbols[count]}`;
            return formattedString;
        }
    }

    public static FormatMoneyString(amount: number, decimalPlaces: number = 0): string {
        if (typeof (amount) === "string") {
            amount = parseFloat(amount);
        } 
        
        let negativeSymbol = (amount < 0) ? "-" : "";
        if (amount < 0) amount = Math.abs(amount);
        let format: {} = { maximumFractionDigits: decimalPlaces };
        if (amount %1 !== 0) {
            format = {minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces}
        }
        let str =  `${negativeSymbol}${NumberUtils.CurrencySymbol}${amount.toLocaleString(undefined, format)}`;
        return str;
    }
  
    // Ordinal Number: 31st, 32nd, 10th etc
    public static OrdinalNumber (num: number): string {
        var suffix: string = "";
        var ones: number = num % 10;
        var tens: number = Math.floor (num / 10) % 10;
        if (tens == 1) {
            suffix = "th";
        } else {
            switch (ones) {
                case 1:
                    suffix = "st";
                    break;
                case 2:
                    suffix = "nd";
                    break;
                case 3:
                    suffix = "rd";
                    break;
                default:
                    suffix = "th";
                    break;
            }
        }
        return num.toString() + suffix;
    }

    // Time Duration String: "1w 5d", "5h 3m"
    public static FormatTimeDurationString(seconds: number): string
    {
        var mins = Math.floor(seconds / 60);
        var hours = Math.floor(mins / 60);
        var days = Math.floor(hours / 24);
        var weeks = Math.floor(days / 7);
        
        if (weeks > 0) return weeks.toString() + "w " + (days % 7).toString()+"d";
        if (days > 0) return days.toString() + "d " + (hours % 24).toString()+"h";
        if (hours > 0) return hours.toString() + "h " + (mins % 60).toString()+"m";
        var secs = Math.ceil(seconds); //Only calculate if we need it
        if (mins > 0) return mins.toString() + "m " + (secs % 60).toString() + "s";
        return (secs % 60).toString() + "s";
    }

    public static FormatShortTimeString(seconds: number): string 
    {
        var displaymins = Math.floor(seconds/60);
        var displayseconds = seconds%60;
        var finaldisplayseconds = displayseconds.toString();
        if (displayseconds<10) finaldisplayseconds = "0"+finaldisplayseconds;
        return displaymins.toString() +":"+finaldisplayseconds;
    }
  
}

