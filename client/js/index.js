$(document).ready(function () {
    $('input[name="navOptions"]').change(
        function () {
            var pageToLoad = $(this).val();
            $('#page').load(pageToLoad);
        });
});
