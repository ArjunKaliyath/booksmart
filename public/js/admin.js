const deleteProduct = (button) => {
    const productId = button.parentElement.querySelector('input[name="productId"]').value; //queries the productId by searching button's parent element which is the form
    const csrfToken = button.parentElement.querySelector('input[name="CSRFToken"]').value;

    const productElement = button.closest('article'); // Get the closest card element ancestor to the button 

    if (confirm("Are you sure you want to delete this product?")) {
        fetch('/admin/product/' + productId , { //fetch API allows us to make network requests with url and options as an object 
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
               "x-csrf-token": csrfToken
            },
            // body: JSON.stringify({ productId: productId }) 
        })
        .then(result => {
            return result.json(); // Parse the response as JSON
        })
        .then(data => { 
            if (data.success) { //data holds response from server 
                console.log('data from server:', data);
                productElement.parentNode.removeChild(productElement); // we find the parent of the productElement which is the card and remove the productElement from it
                alert("Product deleted successfully!"); // Show success message
            } else {
                alert("Failed to delete product. Please try again.");
            }
        })
        .catch(error => {
            console.error("Error deleting product:", error);
        });
    }
}