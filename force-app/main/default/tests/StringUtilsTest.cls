@isTest
public with sharing class StringUtilsTest {
    
    // ========== Tests pour normalize ==========
    
    @isTest
    static void testNormalizeWithNull() {
        String result = StringUtils.normalize(null);
        System.assertEquals(null, result);
    }
    
    @isTest
    static void testNormalizeWithSpaces() {
        String result = StringUtils.normalize('  HELLO  ');
        System.assertEquals('hello', result);
    }
    
    @isTest
    static void testNormalizeWithMixedCase() {
        String result = StringUtils.normalize('Hello World');
        System.assertEquals('hello world', result);
    }
    
    @isTest
    static void testNormalizeWithEmptyString() {
        String result = StringUtils.normalize('');
        System.assertEquals('', result);
    }
    
    // ========== Tests pour levenshteinDistance ==========
    
    @isTest
    static void testLevenshteinIdentical() {
        Integer distance = StringUtils.levenshteinDistance('hello', 'hello');
        System.assertEquals(0, distance);
    }
    
    @isTest
    static void testLevenshteinOneCharDifferent() {
        Integer distance = StringUtils.levenshteinDistance('hello', 'hallo');
        System.assertEquals(1, distance);
    }
    
    @isTest
    static void testLevenshteinTwoCharsDifferent() {
        Integer distance = StringUtils.levenshteinDistance('hello', 'halco');
        System.assertEquals(2, distance);
    }
    
    @isTest
    static void testLevenshteinCompletelyDifferent() {
        Integer distance = StringUtils.levenshteinDistance('abc', 'xyz');
        System.assertEquals(3, distance);
    }
    
    @isTest
    static void testLevenshteinWithNullFirst() {
        Integer distance = StringUtils.levenshteinDistance(null, 'hello');
        System.assertEquals(5, distance);
    }
    
    @isTest
    static void testLevenshteinWithNullSecond() {
        Integer distance = StringUtils.levenshteinDistance('hello', null);
        System.assertEquals(5, distance);
    }
    
    @isTest
    static void testLevenshteinBothNull() {
        Integer distance = StringUtils.levenshteinDistance(null, null);
        System.assertEquals(0, distance);
    }
    
    @isTest
    static void testLevenshteinEmptyStrings() {
        Integer distance = StringUtils.levenshteinDistance('', '');
        System.assertEquals(0, distance);
    }
    
    @isTest
    static void testLevenshteinOneEmpty() {
        Integer distance = StringUtils.levenshteinDistance('hello', '');
        System.assertEquals(5, distance);
    }
    
    // ========== Tests pour soundex ==========
    
    @isTest
    static void testSoundexWithNull() {
        String result = StringUtils.soundex(null);
        System.assertEquals(null, result);
    }
    
    @isTest
    static void testSoundexWithEmpty() {
        String result = StringUtils.soundex('');
        System.assertEquals('', result);
    }
    
    @isTest
    static void testSoundexRobert() {
        // Robert → R163
        String result = StringUtils.soundex('Robert');
        System.assertEquals('R163', result);
    }
    
    @isTest
    static void testSoundexRupert() {
        // Rupert → R163
        String result = StringUtils.soundex('Rupert');
        System.assertEquals('R163', result);
    }
    
    @isTest
    static void testSoundexAshcraft() {
        // Ashcraft → A261
        String result = StringUtils.soundex('Ashcraft');
        System.assertEquals('A261', result);
    }
    
    @isTest
    static void testSoundexAshcroft() {
        // Ashcroft → A261
        String result = StringUtils.soundex('Ashcroft');
        System.assertEquals('A261', result);
    }
    
    @isTest
    static void testSoundexTymczak() {
        // Tymczak → T522
        String result = StringUtils.soundex('Tymczak');
        System.assertEquals('T522', result);
    }
    
    @isTest
    static void testSoundexPfister() {
        // Pfister → P236
        String result = StringUtils.soundex('Pfister');
        System.assertEquals('P236', result);
    }
    
    @isTest
    static void testSoundexLowerCase() {
        // Lowercase input should work the same
        String result = StringUtils.soundex('robert');
        System.assertEquals('R163', result);
    }
    
    @isTest
    static void testSoundexWithSpaces() {
        // Spaces should be trimmed
        String result = StringUtils.soundex('  Robert  ');
        System.assertEquals('R163', result);
    }
}