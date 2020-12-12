function get_bigrams(string){
    let s = string.toLowerCase()
    let bigrams = [];
    for(let i=0; i < s.length - 1; i++)
    { 
        bigrams[i] = s.slice(i, i + 2); 
    }
    return bigrams;
}

function string_similarity(str1, str2){
    if(str1.length>0 && str2.length>0){
        let pairs1 = get_bigrams(str1);
        let pairs2 = get_bigrams(str2);
        let total_length = pairs1.length + pairs2.length;
        let hits = 0;
        for(let x=0; x<pairs1.length; x++){
            for(let y=0; y<pairs2.length; y++){
                if(pairs1[x]==pairs2[y]) hits++;
            }
        }
        if(hits>0) {
            return ((2 * hits) / total_length);    // multiply by 2 to ensure score is between 0 and 1 
        }
    }
    return 0.0
}

module.exports = string_similarity;