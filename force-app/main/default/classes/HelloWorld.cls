public with sharing class HelloWorld {
    
    public static String greet(String name) {
        if (name == null || name == '') {
            return 'Hello, World!';
        }
        return 'Hello, ' + name + '!';
    }
    
    public static Integer add(Integer a, Integer b) {
        return a + b;
    }
    // version 6.0
}