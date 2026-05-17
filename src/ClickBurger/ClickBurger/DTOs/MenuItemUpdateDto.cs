namespace ClickBurger.DTOs;

public class MenuItemUpdateDto
{
    public string? Name { get; set; }

    public string? Description { get; set; }

    public decimal? Price { get; set; }

    public string? Category { get; set; }

    public List<string>? Images { get; set; }

    public bool? Available { get; set; }
}
