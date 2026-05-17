internal class ProductDto
{
    public string Name { get; set; } = string.Empty;
    public double Price { get; set; }
    public int Quantity { get; set; }
    public List<string> Base64Imagens { get; set; } = new();
}