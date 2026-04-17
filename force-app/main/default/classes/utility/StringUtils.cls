public class StringUtils {

    public static String normalize(String input) {
        if (input == null) {
            return null;
        }
        return input.trim().toLowerCase();
    }

    //--------- LEVENSHTEIN FOR FUZZY MATCHING ----------

    public static Integer levenshteinDistance(String s1, String s2) {
    if (s1 == null) s1 = '';
    if (s2 == null) s2 = '';

    Integer len1 = s1.length();
    Integer len2 = s2.length();

    // Create matrix
    List<List<Integer>> dp = new List<List<Integer>>();

    for (Integer i = 0; i <= len1; i++) {
        List<Integer> row = new List<Integer>();
        for (Integer j = 0; j <= len2; j++) {
            row.add(0);
        }
        dp.add(row);
    }

    // Initialize
    for (Integer i = 0; i <= len1; i++) {
        dp[i][0] = i;
    }
    for (Integer j = 0; j <= len2; j++) {
        dp[0][j] = j;
    }

    // Compute
    for (Integer i = 1; i <= len1; i++) {
        for (Integer j = 1; j <= len2; j++) {
            Integer cost = (s1.substring(i-1, i) == s2.substring(j-1, j)) ? 0 : 1;

            dp[i][j] = Math.min(
                Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1),
                dp[i-1][j-1] + cost
            );
        }
    }

    return dp[len1][len2];
}

//------------------ SOUNDEX FOR PHONETIC MATCHING --------------
public static String soundex(String input) {

    if (input == null) {
        return null;
    }

    String str = normalize(input);

    if (String.isBlank(str)) {
        return '';
    }

    String firstLetter = str.substring(0, 1).toUpperCase();

    String result = firstLetter;
    String prevCode = '';

    for (Integer i = 1; i < str.length(); i++) {

        String ch = str.substring(i, i+1);
        String code = getSoundexCode(ch);

        if (code != null) {

            if (code != prevCode) {
                result += code;
                prevCode = code;
            }

        } else {
            prevCode = '';
        }
    }

    result += '0000';
    result = result.substring(0, 4);

    return result;
}

private static String getSoundexCode(String ch) {

    if (ch == 'b' || ch == 'f' || ch == 'p' || ch == 'v') return '1';

    if (ch == 'c' || ch == 'g' || ch == 'j' || ch == 'k' ||
        ch == 'q' || ch == 's' || ch == 'x' || ch == 'z') return '2';

    if (ch == 'd' || ch == 't') return '3';

    if (ch == 'l') return '4';

    if (ch == 'm' || ch == 'n') return '5';

    if (ch == 'r') return '6';

    return null;
}
}