public class OrderService {

    public static double calculateTotal(double price, int quantity) {
        double total = price * quantity;

        if (total >= 1000000) {
            total = total - total * 10 / 100;
        }

        return total;
    }

    public static void main(String[] args) {
        System.out.println(calculateTotal(250000, 4));
    }
}