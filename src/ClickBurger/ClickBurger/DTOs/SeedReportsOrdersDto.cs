namespace ClickBurger.DTOs;

public class SeedReportsOrdersRequestDto
{
    /// <summary>Número de pedidos FECHADO a inserir (padrão 40).</summary>
    public int Count { get; set; } = 40;

    /// <summary>Distribuir fechamentos aleatoriamente nos últimos N dias (padrão 35).</summary>
    public int DaysBack { get; set; } = 35;
}

public class SeedReportsOrdersResultDto
{
    public int InsertedOrders { get; set; }

    public bool TablesEnsured { get; set; }

    public bool MenuItemsEnsured { get; set; }

    public string Message { get; set; } = string.Empty;
}
