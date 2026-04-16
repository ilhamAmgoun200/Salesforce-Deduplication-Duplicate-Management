public interface IMatchingStrategy {
    Double match(Object fieldValue, Object compareValue);
    String getMethodName();
}