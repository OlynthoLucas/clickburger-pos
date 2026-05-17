namespace ClickBurger.Models;

public static class OrderStatus
{
    public const string ABERTO = "ABERTO";
    public const string PREPARANDO = "PREPARANDO";
    public const string PRONTO = "PRONTO";
    public const string FECHADO = "FECHADO";
    public const string CANCELADO = "CANCELADO";
}

public static class PaymentMethods
{
    public const string DINHEIRO = "DINHEIRO";
    public const string CARTAO = "CARTAO";
    public const string PIX = "PIX";
}