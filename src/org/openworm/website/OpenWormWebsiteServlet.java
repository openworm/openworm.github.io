package org.openworm.website;
import java.io.IOException;
import javax.servlet.http.*;

@SuppressWarnings("serial")
public class OpenWormWebsiteServlet extends HttpServlet {
	public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		resp.setContentType("text/plain");
		resp.getWriter().println("THE WORM SINGULARITY IS NEAR!");
	}
}
