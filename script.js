var notSupport = document.getElementById('notSupport');
        function checkBrowser() { 
            if(navigator.userAgent.indexOf("UCBrowser") != -1 || navigator.userAgent.indexOf("MiuiBrowser") != -1 || navigator.userAgent.indexOf("OppoBrowser") != -1) {
                showModal(notSupport);
                if (loader) {
                    loader.style.display = "none";
                }
            }
        }
        checkBrowser()