
// to load tegaki add the following lines to your html head
//
//    <link href="/src/tegaki/tegaki.css" rel="stylesheet" type="text/css">"
//    <script src="/src/tegaki/tegaki.min.js"></script>

export function runTegaki(): Promise<Blob | null> {
    return new Promise((resolve, reject) => {
        const Tegaki: any = (window as any).Tegaki;
        Tegaki.open({
            onDone: function () {
                Tegaki.flatten().toBlob((imageBlob: Blob) => resolve(imageBlob), "image/png");
            },
            onCancel: function () {
                resolve(null);
            },

            // initial canvas size
            width: 380,
            height: 380,
        });
    });
}